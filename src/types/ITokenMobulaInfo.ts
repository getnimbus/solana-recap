export interface ITokenMobulaInfo {
  id:          number;
  name:        string;
  symbol:      string;
  contracts:   string[];
  blockchains: string[];
  decimals:    number[];
  twitter:     string;
  website:     string;
  logo:        string;
  price:       number;
  market_cap:  number;
  liquidity:   number;
  volume:      number;
  type:        string;
  pairs:       Pair[];
}

export interface Pair {
  token0:     Token;
  token1:     Token;
  volume24h:  number;
  liquidity:  number;
  blockchain: string;
  address:    string;
  createdAt:  Date;
  type:       string;
  baseToken:  string;
  exchange:   string;
  factory:    string;
  quoteToken: string;
}

export interface Token {
  address:                    string;
  price:                      number;
  priceToken:                 number;
  priceTokenString:           string;
  logo:                       string;
  approximateReserveUSD:      number;
  approximateReserveTokenRaw: string;
  approximateReserveToken:    number;
  symbol:                     string;
  name:                       string;
  id:                         number;
  decimals:                   number;
  totalSupply:                number;
  circulatingSupply:          number;
}
