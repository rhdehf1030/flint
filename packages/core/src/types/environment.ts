export interface EnvMap {
  [key: string]: string;
}

export interface Environment {
  name: string;
  vars: EnvMap;
}

export interface EnvInheritanceChain {
  base: EnvMap;
  named: EnvMap;
  resolved: EnvMap;
}
