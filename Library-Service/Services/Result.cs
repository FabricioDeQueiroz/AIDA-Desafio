namespace Library_Service.Services;

/// <summary>
/// A generic wrapper that represents the outcome of a service operation.
/// </summary>
/// <typeparam name="T">The type of the data returned on success.</typeparam>
public class Result<T>
{
    /// <summary>
    /// Gets a value indicating whether the operation was successful.
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// Gets the error message if the operation failed.
    /// </summary>
    public string? Error { get; init; }

    /// <summary>
    /// Gets the data returned by the operation. Should be checked only if <see cref="Success"/> is true.
    /// </summary>
    public T? Data { get; init; }

    /// <summary>
    /// Creates a successful result containing the provided data.
    /// </summary>
    /// <param name="data">The data resulting from the operation.</param>
    /// <returns>A new <see cref="Result{T}"/> instance marked as successful.</returns>
    public static Result<T> Ok(T data) => new() { Success = true, Data = data };
    
    /// <summary>
    /// Creates a failed result with a specific error message.
    /// </summary>
    /// <param name="error">The description of the error that occurred.</param>
    /// <returns>A new <see cref="Result{T}"/> instance marked as a failure.</returns>
    public static Result<T> Failure(string error) => new() { Success = false, Error = error };
}