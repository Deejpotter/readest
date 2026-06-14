import { generateText } from 'ai';
import { Book } from '@/types/book';
import { AISettings } from '@/services/ai/types';
import { getAIProvider } from '@/services/ai/providers';

export const DEFAULT_SHELVES = [
  'Art',
  'Bios',
  'Business',
  'Classics',
  'Comics',
  'Creative',
  'Design',
  'DIY',
  'Fantasy',
  'Game dev',
  'Other dev',
  'Personal',
  'Science',
  'Technology',
  'History',
  'Philosophy',
  'Fiction',
  'Non-fiction',
];

/**
 * Classifies a book into a shelf based on its metadata using AI.
 */
export async function classifyBook(
  book: Book,
  settings: AISettings,
  existingShelves: string[] = DEFAULT_SHELVES,
): Promise<string> {
  if (!settings.enabled) {
    return 'Uncategorized';
  }

  const provider = getAIProvider(settings);
  const model = provider.getModel();

  const metadata = book.metadata;
  const bookInfo = `
Title: ${book.title}
Author: ${book.author}
Description: ${metadata?.description || 'N/A'}
Subjects: ${Array.isArray(metadata?.subject) ? metadata.subject.join(', ') : metadata?.subject || 'N/A'}
`;

  const prompt = `
You are a professional librarian. Your task is to classify the following book into one of the existing shelves or suggest a new one if none of the existing ones fit well.

Existing Shelves:
${existingShelves.join(', ')}

Book Information:
${bookInfo}

Instructions:
1. Choose the most appropriate shelf from the existing list.
2. If none of the existing shelves are a good fit, suggest a new, concise shelf name (1-2 words).
3. Return ONLY the name of the shelf.

Shelf:`;

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.1,
    });

    return text.trim();
  } catch (error) {
    console.error('Failed to classify book:', error);
    return 'Uncategorized';
  }
}

/**
 * Batch classifies books that don't have a shelf.
 */
export async function batchClassifyBooks(
  books: Book[],
  settings: AISettings,
  onProgress?: (current: number, total: number) => void,
): Promise<Book[]> {
  const booksToClassify = books.filter((b) => !b.shelf && !b.deletedAt);
  if (booksToClassify.length === 0) return books;

  const shelves = Array.from(new Set(books.map((b) => b.shelf).filter(Boolean) as string[]));
  const finalShelves = shelves.length > 0 ? shelves : DEFAULT_SHELVES;

  const updatedBooks = [...books];
  let count = 0;

  for (const book of booksToClassify) {
    const shelf = await classifyBook(book, settings, finalShelves);
    const idx = updatedBooks.findIndex((b) => b.hash === book.hash);
    if (idx !== -1 && updatedBooks[idx]) {
      updatedBooks[idx] = {
        ...updatedBooks[idx],
        shelf,
        updatedAt: Date.now(),
      } as Book;
    }
    count++;
    onProgress?.(count, booksToClassify.length);
  }

  return updatedBooks;
}
