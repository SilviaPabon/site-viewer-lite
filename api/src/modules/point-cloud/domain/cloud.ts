// Where a project's point cloud file lives. Implementations decide the storage (disk today).
export interface CloudStore {
  // Absolute directory and file name when the file exists, undefined otherwise.
  locate(fileName: string): Promise<{ dir: string; file: string } | undefined>;
}
