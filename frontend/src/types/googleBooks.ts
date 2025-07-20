export interface GoogleBooksResult {
  items: GoogleBooksItem[];
  kind: string;
  totalItems: number;
}

export interface GoogleBooksItem {
  id: string;
  volumeInfo: BookVolumeInfo;
}

export interface BookVolumeInfo {
  title: string;
  authors: string[];
  description: string;
  pageCount: number;
  imageLinks: {
    thumbnail: string;
  };
}

export interface GoogleBooksRelevantBookData {
  id: string;
  bookTitle: string;
  authorName: string;
  pageCount: number;
  imageUrl: string;
}

export interface GoogleBooksSearchParams {
  bookTitle: string;
  authorName?: string;
}
