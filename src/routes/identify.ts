import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "At least one of email or phoneNumber must be provided",
      });
    }

    // Find direct matches
    const matchedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: "asc" },
    });

    // If none → create new primary
    if (matchedContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary",
        },
      });

      return res.status(200).json({
        contact: {
          primaryContatctId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: [],
        },
      });
    }

    // Determine all possible primary IDs
    const primaryIds = new Set<number>();

    for (const contact of matchedContacts) {
      if (contact.linkPrecedence === "primary") {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    // Fetch full contact group based on those primary IDs
    const relatedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: { in: Array.from(primaryIds) } },
          { linkedId: { in: Array.from(primaryIds) } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Find oldest primary
    const primaryContacts = relatedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const oldestPrimary = primaryContacts[0];

    if (!oldestPrimary) {
      throw new Error("No primary contact found — DB corrupted");
    }

    // Merge multiple primaries if needed
    if (primaryContacts.length > 1) {
      for (const contact of primaryContacts.slice(1)) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: oldestPrimary.id,
          },
        });
      }
    }

    // Check if new info exists
    const emailExists = relatedContacts.some((c) => c.email === email);
    const phoneExists = relatedContacts.some(
      (c) => c.phoneNumber === phoneNumber,
    );

    if ((email && !emailExists) || (phoneNumber && !phoneExists)) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "secondary",
          linkedId: oldestPrimary.id,
        },
      });
    }

    // Fetch final group
    const finalContacts = await prisma.contact.findMany({
      where: {
        OR: [{ id: oldestPrimary.id }, { linkedId: oldestPrimary.id }],
      },
      orderBy: { createdAt: "asc" },
    });

    const emails = [
      ...new Set(finalContacts.map((c) => c.email).filter(Boolean)),
    ] as string[];

    const phoneNumbers = [
      ...new Set(finalContacts.map((c) => c.phoneNumber).filter(Boolean)),
    ] as string[];

    const secondaryContactIds = finalContacts
      .filter((c) => c.id !== oldestPrimary.id)
      .map((c) => c.id);

    return res.status(200).json({
      contact: {
        primaryContatctId: oldestPrimary.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
