export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data?: T;

  private cookieOptions?: { name: string; value: string; options: any };

  constructor(statusCode: number, message: string, data?: T) {
    this.statusCode = statusCode;
    this.success = statusCode < 400; // true for 200, 300 status code
    this.message = message;

    if (data) {
      this.data = data;
    }
  }
  // method for send cookies
  public withCookie(name: string, value: string, options: any = {}) {
    this.cookieOptions = {
      name,
      value,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        ...options,
      },
    };
    return this;
  }

  // helper method to not write every time re.status and res.json
  public send(res: any) {
    if (this.cookieOptions) {
      res.cookie(
        this.cookieOptions.name,
        this.cookieOptions.value,
        this.cookieOptions.options,
      );
    }
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      ...(this.data && { data: this.data }), //if data then send data else hide data
    });
  }
}
