interface IErrors {
  rowNumber: number;
  field: string | null;
  message: string;
}

interface IObjectError {
  name: string;
  userMessage: string;
}

export interface IAxioDataError {
  detail: string;
  errors?: IErrors[];
  message?: string;
  response: {
    data: {
      message: string;
      detail: string;
      userMessage: string;
    };
  };
  objects?: IObjectError[];
}
