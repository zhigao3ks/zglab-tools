export interface RegexMatch {
  index: number;
  value: string;
  groups: Array<string | undefined>;
  namedGroups: Record<string, string | undefined>;
}

export interface RegexResult {
  matches: RegexMatch[];
  replaced: string;
}
