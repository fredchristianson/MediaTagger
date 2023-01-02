import { dbLoadSettings, dbSaveSettings } from "../data/database.js";

export class Settings {
  static async load(scope, defaultValues) {
    var json = await dbLoadSettings(scope);
    if (json == null) {
      return new Settings({ scope: scope, values: defaultValues ?? {} });
    } else {
      return new Settings({ scope: scope, values: json.values });
    }
  }

  constructor(json) {
    this.scope = json.scope;
    this.values = json.values;
  }

  get(name, defaultValue = null) {
    return this.values[name] ?? defaultValue;
  }

  set(name, value) {
    if (name != value) {
      this.values[name] = value;
      dbSaveSettings(this);
    }
  }
  toJson() {
    return {
      scope: this.scope,
      values: this.values,
    };
  }
}
export default Settings;
