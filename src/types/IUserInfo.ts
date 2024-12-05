export interface IUserInfo {
  id:             string;
  publicAddress:  string;
  email:          null;
  referrer:       null;
  createdAt:      Date;
  updatedAt:      Date;
  suiCampAllowed: boolean;
  totalPoint:     number;
  totalQuest:     number;
  plan:           Plan;
  displayName:    string;
}

export interface Plan {
  tier:         string;
  interval:     string;
  startDate:    Date;
  endDate:      Date;
  subscription: boolean;
}
