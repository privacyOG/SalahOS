export type HadithLibraryBlock = Readonly<{ kind: 'text' | 'arabic'; text: string }>;

export type NawawiHadithLibraryEntry = Readonly<{
  id: string;
  number: number;
  sourceHeading: string;
  reference: string;
  blocks: readonly HadithLibraryBlock[];
}>;
