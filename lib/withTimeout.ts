export async function withTimeout<T>(
    operation: PromiseLike<T>,
    milliseconds = 15000,
    message = "通信に時間がかかっています。再試行してください。"
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
  
    try {
      return await Promise.race([
        Promise.resolve(operation),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(message));
          }, milliseconds);
        }),
      ]);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }
  