FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dev

WORKDIR /src

RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"

ENV ASPNETCORE_ENVIRONMENT=Development

EXPOSE 5042

COPY ["Library-Service/Library-Service.csproj", "Library-Service/"]
RUN dotnet restore "Library-Service/Library-Service.csproj"

COPY . .

WORKDIR "/src/Library-Service/"

CMD ["dotnet", "watch", "run", "--urls", "http://0.0.0.0:5042"]

FROM dev AS test
CMD ["dotnet", "test", "Library-Service.csproj", "-l", "console;verbosity=normal"]

FROM dev AS lint
CMD ["dotnet", "format", "Library-Service.csproj", "--verify-no-changes", "--verbosity", "d"]