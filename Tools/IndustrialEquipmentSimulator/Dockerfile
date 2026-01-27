# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /app

# Copy project files and nuget config
COPY *.csproj ./
COPY nuget.config ./

RUN dotnet restore

# Copy the rest of the source and build the app
COPY . ./
RUN dotnet publish -c Release -o /out

# Runtime image
FROM mcr.microsoft.com/dotnet/runtime:8.0

WORKDIR /app

# Copy the published output from build stage
COPY --from=build /out .

# Set entrypoint to the application
ENTRYPOINT ["dotnet", "IndustrialEquipmentSimulator.dll"]
