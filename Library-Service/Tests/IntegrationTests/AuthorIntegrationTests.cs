using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace Library_Service.Tests.IntegrationTests;

public class AuthorIntegrationTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private async Task<AuthorDetailResponse> CreateAuthorAsync(string name, string? nationality)
    {
        var payload = new { name, nationality };
        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/author/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(response);
        Assert.NotNull(createdAuthor);

        return createdAuthor!;
    }

    private static async Task<T?> DeserializeResponseAsync<T>(HttpResponseMessage response)
    {
        await using var responseStream = await response.Content.ReadAsStreamAsync(TestContext.Current.CancellationToken);
        return await JsonSerializer.DeserializeAsync<T>(responseStream, JsonOptions, TestContext.Current.CancellationToken);
    }

    private static string GenerateIsbn13()
    {
        var seed = $"{DateTime.UtcNow.Ticks}{Guid.NewGuid():N}";
        var numeric = new string(seed.Where(char.IsDigit).ToArray());
        return numeric.Length >= 13 ? numeric.Substring(0, 13) : numeric.PadRight(13, '1');
    }

    private sealed record AuthorDetailResponse(
        Guid IdAuthor,
        string Name,
        string? Nationality
    );

    [Theory(DisplayName = "CreateAuthorSuccess - Integration & Parametrized")]
    [InlineData("Machado de Assis", "BR")]
    [InlineData("Clarice Lispector", "BR")]
    [InlineData("Jorge Amado", "BR")]
    [InlineData("Guimarães Rosa", "BR")]
    [InlineData("Carlos Drummond de Andrade", "BR")]
    [InlineData("Monteiro Lobato", "BR")]
    [InlineData("José de Alencar", "BR")]
    [InlineData("Ernest Hemingway", "US")]
    [InlineData("Mark Twain", "US")]
    [InlineData("Stephen King", "US")]
    [InlineData("George Orwell", "GB")]
    [InlineData("Virginia Woolf", "GB")]
    [InlineData("Franz Kafka", "CZ")]
    [InlineData("Fyodor Dostoevsky", "RU")]
    [InlineData("Leo Tolstoy", "RU")]
    [InlineData("Gabriel García Márquez", null)]
    [InlineData("J. R. R. Tolkien", null)]
    [InlineData("Jane Austen", null)]
    [InlineData("Agatha Christie", null)]
    [InlineData("Haruki Murakami", null)]
    [InlineData("Rachel Carson", "US")]
    [InlineData("Jack London", "US")]
    [InlineData("Cecília Meireles", "BR")]
    [InlineData("Ariano Suassuna", "BR")]
    [InlineData("Victor Hugo", "FR")]
    [InlineData("H. P. Lovecraft", null)]
    [InlineData("Cuttlefish That Loves Diving", "CN")]
    [InlineData("Park Saenal", "KR")]
    [InlineData("Brandon Lee - TurtleMe", "US")]
    [InlineData("Sing Shong", "KR")]
    public async Task CreateAuthorSuccess(string name, string? nationality)
    {
        var newAuthor = new { name, nationality };

        using var content = new StringContent(JsonSerializer.Serialize(newAuthor), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/author/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(response);
        Assert.NotNull(createdAuthor);
        Assert.Equal(name, createdAuthor!.Name);
        Assert.Equal(nationality, createdAuthor.Nationality);
    }

    [Theory(DisplayName = "CreateAuthorFail - Name and Nationality Validation")]
    [InlineData("Al", "BR")]
    [InlineData("Jo", null)]
    [InlineData("Autor Válido", "BRA")]
    [InlineData("Li", "USA")]
    public async Task CreateAuthorFailValidation(string name, string? nationality)
    {
        var invalidAuthor = new { name, nationality };
        using var content = new StringContent(JsonSerializer.Serialize(invalidAuthor), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/author/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact(DisplayName = "AuthorFlow - POST then GET by id")]
    public async Task AuthorFlowPostThenGetById()
    {
        var created = await CreateAuthorAsync("Graciliano Ramos", "BR");

        var getResponse = await _client.GetAsync(new Uri($"/author/{created.IdAuthor}", UriKind.Relative), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var fetchedAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(getResponse);
        Assert.NotNull(fetchedAuthor);
        Assert.Equal(created.IdAuthor, fetchedAuthor!.IdAuthor);
        Assert.Equal("Graciliano Ramos", fetchedAuthor.Name);
        Assert.Equal("BR", fetchedAuthor.Nationality);
    }

    [Fact(DisplayName = "UpdateAuthorSuccess - Integration")]
    public async Task UpdateAuthorSuccess()
    {
        var created = await CreateAuthorAsync("Edgar Allan Poe", "US");
        var updatePayload = new
        {
            idAuthor = created.IdAuthor,
            name = "Edgar Allan Poe Updated",
            nationality = "US"
        };

        using var content = new StringContent(JsonSerializer.Serialize(updatePayload), Encoding.UTF8, "application/json");

        var updateResponse = await _client.PutAsync(new Uri($"/author/{created.IdAuthor}", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updatedAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(updateResponse);
        Assert.NotNull(updatedAuthor);
        Assert.Equal("Edgar Allan Poe Updated", updatedAuthor!.Name);

        var getResponse = await _client.GetAsync(new Uri($"/author/{created.IdAuthor}", UriKind.Relative), TestContext.Current.CancellationToken);
        var fetchedAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(getResponse);
        Assert.NotNull(fetchedAuthor);
        Assert.Equal("Edgar Allan Poe Updated", fetchedAuthor!.Name);
    }

    [Fact(DisplayName = "UpdateAuthorFail - Mismatched id in route and body")]
    public async Task UpdateAuthorFailIdMismatch()
    {
        var created = await CreateAuthorAsync("Neil Gaiman", "GB");
        var differentId = Guid.NewGuid();

        var invalidUpdatePayload = new
        {
            idAuthor = differentId,
            name = "Neil Richard Gaiman",
            nationality = "GB"
        };

        using var content = new StringContent(JsonSerializer.Serialize(invalidUpdatePayload), Encoding.UTF8, "application/json");

        var response = await _client.PutAsync(new Uri($"/author/{created.IdAuthor}", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("não corresponde", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "DeleteAuthorFail - Author with linked books")]
    public async Task DeleteAuthorFailWhenAuthorHasLinkedBooks()
    {
        var createdAuthor = await CreateAuthorAsync("Jules Verne", "FR");

        var newBook = new
        {
            title = "Journey to the Center of the Earth",
            isbn = GenerateIsbn13(),
            year = (short)1864,
            quantity = 7,
            idAuthor = createdAuthor.IdAuthor
        };

        using var bookContent = new StringContent(JsonSerializer.Serialize(newBook), Encoding.UTF8, "application/json");

        var createBookResponse = await _client.PostAsync(new Uri("/book/", UriKind.Relative), bookContent, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, createBookResponse.StatusCode);

        var deleteAuthorResponse = await _client.DeleteAsync(new Uri($"/author/{createdAuthor.IdAuthor}", UriKind.Relative), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, deleteAuthorResponse.StatusCode);

        var responseBody = await deleteAuthorResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("possui livros vinculados", responseBody, StringComparison.OrdinalIgnoreCase);
    }
}