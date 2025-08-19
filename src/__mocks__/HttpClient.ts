export class HttpClient {
  public post = jest.fn();
  public get = jest.fn();
  public put = jest.fn();
  public delete = jest.fn();
  public patch = jest.fn();

  constructor() {
    this.post.mockImplementation(() => Promise.resolve({ success: true, data: {} }));
    this.get.mockImplementation(() => Promise.resolve({ success: true, data: {} }));
    this.put.mockImplementation(() => Promise.resolve({ success: true, data: {} }));
    this.delete.mockImplementation(() => Promise.resolve({ success: true, data: {} }));
    this.patch.mockImplementation(() => Promise.resolve({ success: true, data: {} }));
  }
}