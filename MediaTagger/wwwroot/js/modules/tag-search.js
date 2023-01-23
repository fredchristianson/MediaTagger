import { LOG_LEVEL, Logger } from '../../drjs/logger.js';

const log = Logger.create('TagSearch', LOG_LEVEL.DEBUG);
log.never();

class SearchWord {
  constructor(word = '') {
    this.word = word;
    this.lowerCase = word.toLowerCase();
  }

  addChar(char) {
    this.word += char;
  }
  get Value() {
    return this.word;
  }

  get LowerCase() {
    return this.lowerCase;
  }
  get Length() {
    return this.word.length;
  }
}

class SearchLevel {
  constructor(words = []) {
    this.words = words;
  }

  add(word) {
    this.words.push(word);
  }

  get Words() {
    return this.words;
  }
  get WordCount() {
    return this.words.length;
  }

  match(tagName, searchMatch) {
    let name = tagName;
    for (const word of this.words) {
      const index = name.toLowerCase().indexOf(word.LowerCase);
      if (index < 0) {
        searchMatch.skip(name);
        return null;
      }
      searchMatch.skip(name.substring(0, index));
      searchMatch.match(name.substring(index, index + word.Length));
      name = name.slice(index + word.Length);
    }
    searchMatch.skip(name);
    return name;
  }
}

class SearchPart {
  constructor(chars) {
    this.chars = chars;
    this.level = false;
  }
  get IsMatch() {
    return this.match;
  }
  get IsSkip() {
    return !this.match;
  }
  get isDivider() {
    return this.level;
  }
  get IsDivider() {
    return this.level;
  }
  get Text() {
    return this.chars;
  }
}

class MatchPart extends SearchPart {
  constructor(chars) {
    super(chars);
    this.match = true;
  }
}

class SkipPart extends SearchPart {
  constructor(chars) {
    super(chars);
    this.match = false;
  }
}

class LevelPart extends SearchPart {
  constructor() {
    super('');
    this.match = false;
    this.level = true;
  }
}

class SearchMatch {
  constructor(path) {
    this.success = false;
    this.path = path;
    this.parts = [];
    this.success = false;
    this.remainder = null;
  }

  get Parts() {
    return this.parts;
  }
  skip(chars) {
    if (chars != null && chars.length > 0) {
      const levels = chars.split('/');
      this.parts.push(new SkipPart(levels.shift()));

      for (const level of levels) {
        this.parts.push(new LevelPart());
        if (level != '') {
          this.parts.push(new SkipPart(level));
        }
      }
    }
  }

  match(chars) {
    if (chars != null && chars.length > 0) {
      const levels = chars.split('/');
      this.parts.push(new MatchPart(levels.shift()));
      for (const level of levels) {
        this.parts.push(new LevelPart());
        if (level != '') {
          this.parts.push(new MatchPart(level));
        }
      }
    }
  }

  get Success() {
    return this.success;
  }
  set Success(success) {
    this.success = success;
  }

  get NameMatch() {
    let levelMatch = false;
    for (const part of this.parts) {
      if (part.IsMatch) {
        levelMatch = true;
      } else if (part.IsDivider) {
        levelMatch = false;
      }
    }
    return levelMatch;
  }
  get Remainder() {
    return this.remainder;
  }
  set Remainder(remainder) {
    this.remainder = remainder;
  }
}

class SearchPhrase {
  constructor() {
    this.levels = [];
  }

  addLevel(level) {
    this.levels.push(level);
  }

  get Levels() {
    return this.levels;
  }
  format() {
    let html = "<span class='phrase'>";
    for (const level of this.levels) {
      html += "<span class='level'>";
      for (const word of level.Words) {
        html += `<span class='word'>${word.Value}</span>`;
      }
      html += '</span>';
    }
    html += '</span>';
    return html;
  }

  match(path) {
    if (this.levels.length == 0) {
      const sm = new SearchMatch();
      sm.Success = true;
      return sm;
    }
    let rest = path;
    const searchMatch = new SearchMatch(path);
    for (let index = 0; index < this.levels.length; index++) {
      const level = this.levels[index];
      const part = level.match(rest, searchMatch);
      if (part == null) {
        searchMatch.Success = false;
        return searchMatch;
      }
      const slash = part.indexOf('/');
      if (slash < 0) {
        searchMatch.Remainder = this.combineLevels(
          this.levels.slice(index + 1)
        );

        searchMatch.Success = true;
        return searchMatch;
        //return { isMatch: true, remainder: unmatched };
      }
      rest = part.slice(slash);
    }
    searchMatch.Success = true;
    return searchMatch;
    //return { isMatch: true, remainder: null };
  }

  combineLevels(levels) {
    const combine = levels
      .map((level) => {
        return level.Words.map((w) => {
          return w.Value;
        }).join(' ');
      })
      .join('/');
    return combine;
  }
}

export { SearchWord, SearchLevel, SearchPhrase };
