export interface IPointData {
  data:             Datum[];
  totalPoint:       number;
  dataWhalesMarket: DataWhalesMarket[];
  pointMarketList:  any[];
}

export interface Datum {
  protocol:      string;
  protocolLabel: string;
  note:          string;
  points:        number;
  stage:         string;
}

export interface DataWhalesMarket {
  id:                      string;
  created_at:              Date;
  updated_at:              Date;
  deleted_at:              null;
  network_id:              string;
  update_token_address_id: null;
  address:                 null | string;
  settle_time:             number;
  settle_duration:         number;
  pledge_rate:             number | null;
  status:                  string;
  symbol:                  string;
  name:                    string;
  icon:                    string;
  coin_gecko_id:           null;
  price:                   null;
  total_volume_ask:        number;
  total_volume_bid:        number;
  average_bid:             number;
  average_ask:             number;
  last_price:              number;
  decimals:                null;
  type:                    string;
  token_id:                string;
  short_id:                null | string;
  isHighLight:             number;
  category:                string;
  settle_rate:             number | null;
  runes_id:                null;
  settle_type:             string;
  price_change:            PriceChange;
  volume:                  PriceChange;
  volume_change:           PriceChange;
  accepted_tokens:         any[];
  network:                 Network;
  token_info:              TokenInfo;
  total_value:             number;
  average_bids:            number;
  average_asks:            number;
  website:                 string;
  twitter:                 string;
}

export interface Network {
  id:          string;
  created_at:  Date;
  updated_at:  Date;
  deleted_at:  null;
  name:        string;
  chain_id:    number;
  is_mainnet:  boolean;
  url:         string;
  explorerUrl: string;
  icon:        string;
}

export interface PriceChange {
  h24: number;
}

export interface TokenInfo {
  id:              string;
  created_at:      Date;
  updated_at:      Date;
  deleted_at:      null;
  website:         string;
  twitter:         string;
  start_time:      number;
  banner_url:      string;
  home_banner_url: null;
  symbol:          string;
  token_id:        string;
  priority:        number;
  metadata:        Metadata;
  unit:            Unit;
  category:        string;
}

export interface Metadata {
  icon?:            string;
  title:            string;
  description:      string;
  background_image: string;
  cta:              Cta;
  status?:          string;
  priority?:        number;
}

export interface Cta {
  text: string;
  url:  string;
}

export interface Unit {
  prefix_icon: string;
  icon:        string;
  symbol:      string;
}
