export enum ActionState {
  NotYetPerformed = 'NotYetPerformed',
  InProgress = 'InProgress',
  Success = 'Success',
  Failure = 'Failure'
}
// we need this type as reducers don't like Enum as type specification
export type ActionStateType =
  | ActionState.NotYetPerformed
  | ActionState.InProgress
  | ActionState.Success
  | ActionState.Failure

