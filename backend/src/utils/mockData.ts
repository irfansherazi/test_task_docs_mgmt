import { v4 as uuidv4 } from 'uuid';

export const generateMockExtractions = (documentId: string) => {
  const legalPhrases = [
    "The parties hereby agree to the following terms and conditions:",
    "In accordance with Section 2.1 of the Agreement,",
    "Subject to applicable laws and regulations,",
    "The undersigned parties mutually agree that,",
    "Notwithstanding anything to the contrary herein,",
    "This Agreement shall be governed by and construed in accordance with,",
    "For the avoidance of doubt,",
    "Without limiting the generality of the foregoing,",
    "The parties acknowledge and agree that,",
    "In witness whereof, the parties have executed this Agreement as of"
  ];

  // Generate 8-12 extractions
  const numExtractions = Math.floor(Math.random() * 5) + 8;

  // Create extractions spread across 5 pages
  const extractions = Array.from({ length: numExtractions }, (_, i) => ({
    id: uuidv4(),
    text: legalPhrases[Math.floor(Math.random() * legalPhrases.length)],
    pageNumber: (i % 5) + 1 // Distribute across pages 1-5
  }));

  return {
    documentId,
    extractions: extractions.sort((a, b) => a.pageNumber - b.pageNumber)
  };
}; 