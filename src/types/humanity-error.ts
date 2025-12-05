import { HttpError } from '@nestia/fetcher';

type ErrorPayload = {
  error?: string;
  error_code?: string;
  error_subcode?: string;
  error_description?: string;
  context?: Record<string, unknown>;
};

export class HumanityError extends Error {
  readonly code: string;
  readonly subcode?: string;
  readonly context?: Record<string, unknown>;
  readonly statusCode: number;
  readonly httpError: HttpError;

  private constructor(params: {
    message: string;
    code: string;
    subcode?: string;
    context?: Record<string, unknown>;
    statusCode: number;
    httpError: HttpError;
  }) {
    super(params.message);
    this.code = params.code;
    this.subcode = params.subcode;
    this.context = params.context;
    this.statusCode = params.statusCode;
    this.httpError = params.httpError;
    this.name = 'HumanityError';
  }

  static fromHttpError(error: HttpError): HumanityError {
    const payload = HumanityError.parsePayload(error);
    const code = payload?.error_code ?? payload?.error ?? `HTTP_${error.status}`;
    const message =
      payload?.error_description ??
      payload?.error ??
      `Humanity API request failed with status ${error.status}`;
    const subcode = payload?.error_subcode;
    const context = payload?.context;
    return new HumanityError({
      message,
      code,
      subcode,
      context,
      statusCode: error.status,
      httpError: error,
    });
  }

  toJSON(): {
    code: string;
    subcode?: string;
    context?: Record<string, unknown>;
    statusCode: number;
    message: string;
  } {
    return {
      code: this.code,
      subcode: this.subcode,
      context: this.context,
      statusCode: this.statusCode,
      message: this.message,
    };
  }

  private static parsePayload(error: HttpError): ErrorPayload | undefined {
    const json = error.toJSON<ErrorPayload>();
    if (!json || json.message === undefined || json.message === null) {
      return undefined;
    }
    if (typeof json.message === 'object') {
      return json.message as ErrorPayload;
    }
    if (typeof json.message === 'string') {
      try {
        const parsed = JSON.parse(json.message);
        if (parsed && typeof parsed === 'object') {
          return parsed as ErrorPayload;
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}


