class ApiResponse {
   constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;  // HTTP status code
    this.data = data;  // The actual data being returned
    this.message = message;  // A message describing the status or outcome
    this.success = statusCode < 400;  // Indicates if the status code represents a successful response
  }
}

export { ApiResponse };
