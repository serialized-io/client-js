import {BaseClient} from "./BaseClient";

export interface HttpAction {
  actionType: 'HTTP_POST';
  targetUri: string;
}

export interface IftttAction {
  actionType: 'IFTTT_POST';
  targetUri: string;
  valueMap?: object;
}

export interface AutomateAction {
  actionType: 'AUTOMATE_POST';
  targetUri: string;
  valueMap?: object;
}

export interface ZapierAction {
  actionType: 'ZAPIER_POST';
  targetUri: string;
  valueMap?: object;
}

export interface SlackAction {
  actionType: 'SLACK_POST';
  targetUri: string;
  body?: object;
}

export type Action = HttpAction | SlackAction | IftttAction | AutomateAction | ZapierAction;

export interface ScheduledReaction {
  reactionId: string,
  reactionName: string,
  aggregateType: string,
  aggregateId: string,
  eventId: string,
  createdAt: number,
  triggerAt: number
}

export interface TriggeredReaction {
  reactionId: string,
  reactionName: string,
  aggregateType: string,
  aggregateId: string,
  eventId: string,
  createdAt: number,
  finishedAt: number
}

export interface LoadScheduledReactionsResponse {
  reactions: ScheduledReaction[];
}

export interface LoadTriggeredReactionsResponse {
  reactions: TriggeredReaction[];
}

export interface CreateReactionDefinitionRequest {
  reactionName: string;
  feedName: string;
  reactOnEventType: string;
  action: Action;
  cancelOnEventTypes?: string[];
  triggerTimeField?: string;
  offset?: string;
}

export interface LoadReactionDefinitionResponse {
  reactionName: string;
  feedName: string;
  reactOnEventType: string;
  action: Action;
  cancelOnEventTypes?: string[];
  triggerTimeField?: string;
  offset?: string;
}

export interface LoadReactionDefinitionsResponse {
  definitions: string;
}

export class ReactionsClient extends BaseClient {

  constructor(axiosClient, config) {
    super(axiosClient, config);
  }

  public async createOrUpdateReactionDefinition(request: CreateReactionDefinitionRequest): Promise<void> {
    return (await this.axiosClient.put(`/reactions/definitions`, request, this.axiosConfig())).data;
  };

  public async getReactionDefinition(reactionName: string): Promise<LoadReactionDefinitionResponse> {
    return (await this.axiosClient.get(`/reactions/definitions/${reactionName}`, this.axiosConfig())).data;
  };

  public async listReactionDefinitions(): Promise<LoadReactionDefinitionsResponse> {
    return (await this.axiosClient.get(`/reactions/definitions`, this.axiosConfig())).data;
  };

  public async listScheduledReactions(): Promise<LoadScheduledReactionsResponse> {
    return (await this.axiosClient.get(`/reactions/scheduled`, this.axiosConfig())).data;
  };

  public async listTriggeredReactions(): Promise<LoadTriggeredReactionsResponse> {
    return (await this.axiosClient.get(`/reactions/triggered`, this.axiosConfig())).data;
  };

  public async deleteScheduledReaction(reactionId: string): Promise<void> {
    return (await this.axiosClient.delete(`/reactions/scheduled/${reactionId}`, this.axiosConfig())).data;
  };

  public async executeScheduledReaction(reactionId: string): Promise<void> {
    return (await this.axiosClient.post(`/reactions/scheduled/${reactionId}`, this.axiosConfig())).data;
  };

  public async reExecuteTriggeredReaction(reactionId: string): Promise<void> {
    return (await this.axiosClient.post(`/reactions/triggered/:reactionId`, this.axiosConfig())).data;
  };

}
