import DiffMatchPatch from 'diff-match-patch';

class DiffService {
  private dmp: DiffMatchPatch;

  constructor() {
    this.dmp = new DiffMatchPatch();
  }

  computeDiff(text1: string, text2: string) {
    const diffs = this.dmp.diff_main(text1, text2);
    this.dmp.diff_cleanupSemantic(diffs);
    return diffs;
  }

  getDiffHtml(text1: string, text2: string): string {
    const diffs = this.computeDiff(text1, text2);
    return this.dmp.diff_prettyHtml(diffs);
  }

  getSimilarity(text1: string, text2: string): number {
    const diffs = this.computeDiff(text1, text2);
    const levenshtein = this.dmp.diff_levenshtein(diffs);
    const maxLength = Math.max(text1.length, text2.length);
    return ((maxLength - levenshtein) / maxLength) * 100;
  }
}

export const diffService = new DiffService();
