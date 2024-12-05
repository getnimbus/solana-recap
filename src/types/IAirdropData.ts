export interface IAirdropData {
  protocol:           string;
  protocolLabel:      string;
  token:              string;
  ticker:             string;
  eligible:           boolean;
  amount:             number;
  note:               string;
  potentialValueUsdc: number;
  stage:              string;
  tokenPrice:         number;
  latency:            number;
  logoUrl:            string;
}
