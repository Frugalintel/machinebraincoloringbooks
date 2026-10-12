import type { ReviewFields } from "@/lib/review/manifest";

export type ReviewPageView = {
  id: string;
  number: number;
  colorUrl: string | null;
  linePngUrl: string | null;
  lineSvgUrl: string | null;
  status?: string;
};

export type ReviewMatterView = {
  id: string;
  width: number;
  height: number;
  templatePath: string;
  preparedHtml: string;
  fields: ReviewFields;
  previewUrl: string | null;
};

export type ReviewCoverView = ReviewMatterView & {
  foldsX: number[];
  parts: string[];
  previewWrapUrl: string | null;
  previewFrontUrl: string | null;
};

export type ReviewBookPayload = {
  slug: string;
  title: string;
  version: number;
  trim: {
    in: number[];
    page_count: number;
  };
  cover: ReviewCoverView;
  frontMatter: ReviewMatterView[];
  pages: ReviewPageView[];
  backMatter: ReviewMatterView[];
  signedUrls: Record<string, string>;
};

export type ReviewFlag = {
  flag: boolean;
  note: string;
};

export type ReviewInsert = {
  id: string;
  after: string | null;
  description: string;
};

export type ReviewSubmissionPayload = {
  order: string[];
  deleted: string[];
  flags: Record<string, ReviewFlag>;
  inserts: ReviewInsert[];
  fields: Record<string, ReviewFields>;
  uploads: string[];
  submitted_at: string;
};

export type ReviewDraft = Omit<ReviewSubmissionPayload, "submitted_at">;

export type ReviewSubmissionRow = {
  id: string;
  book_slug: string;
  version: number;
  payload: ReviewSubmissionPayload;
  created_at: string;
};
