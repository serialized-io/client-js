import {AggregatesClient} from "./AggregateClient";
import {ProjectionsClient} from './ProjectionsClient'

import {FeedsClient} from './FeedsClient'
import {ReactionsClient} from './ReactionsClient'

export class SerializedInstance {
  
  public readonly aggregates: AggregatesClient;
  public readonly projections: ProjectionsClient;
  public readonly feeds: FeedsClient;
  public readonly reactions: ReactionsClient;

  constructor(public readonly config, public readonly axiosClient) {
    this.aggregates = new AggregatesClient(axiosClient, config);
    this.projections = new ProjectionsClient(axiosClient, config);
    this.feeds = new FeedsClient(axiosClient, config);
    this.reactions = new ReactionsClient(axiosClient, config);
  }

}
