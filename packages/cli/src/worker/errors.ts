import { workerErrorMessage } from "@elix/protocol";

export class WorkerError extends Error {
  constructor(
    readonly code: string,
    message = workerErrorMessage(code),
  ) {
    super(message);
    this.name = "WorkerError";
  }
}
