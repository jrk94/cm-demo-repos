# NOTE: this project now targets .NET Framework 4.7.2, which only runs on Windows.
# These images require Windows containers (Windows base image + `docker run` on a
# Windows Docker host) - they will NOT run on a Linux Docker host.

# Use the .NET Framework SDK image (includes MSBuild) to build the app
FROM mcr.microsoft.com/dotnet/framework/sdk:4.7.2 AS build

EXPOSE 5000-5999/tcp

WORKDIR /app

# Copy nuget.config before restore
COPY nuget.config ./

# Copy project file and restore dependencies
COPY *.csproj ./
RUN nuget restore SMTSimulator.csproj

# Copy the rest of the source and build the app
COPY . ./
RUN msbuild SMTSimulator.csproj /p:Configuration=Release /p:OutputPath=C:\out

# Runtime image
FROM mcr.microsoft.com/dotnet/framework/runtime:4.7.2

WORKDIR /app

# Copy the published output from build stage
COPY --from=build C:\out .

# After publishing your .NET app
COPY ./Artifacts/ /app/config/
COPY ./Artifacts/DataPlatform.config.full.json /app/config/config.full.json

# Optional: set env variable
ENV CONFIG_PATH=/app/config/config.full.json

# Set a default command that does nothing (overridden when you manually exec)
CMD ["ping", "-t", "localhost"]
