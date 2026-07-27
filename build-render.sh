#!/usr/bin/env bash
# Exit on error
set -e

echo "=== Starting Render Build script (Without Docker) ==="

# 1. Download and set up JDK 21
if [ ! -d "jdk" ]; then
  echo "=== Downloading JDK 21 ==="
  curl -L -o jdk.tar.gz "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_linux_hotspot_21.0.1_12.tar.gz"
  mkdir -p jdk
  tar -xzf jdk.tar.gz -C jdk --strip-components=1
  rm jdk.tar.gz
else
  echo "=== JDK 21 already exists, skipping download ==="
fi

export JAVA_HOME="$(pwd)/jdk"
export PATH="$JAVA_HOME/bin:$PATH"

# 2. Download and set up Maven
if [ ! -d "maven" ]; then
  echo "=== Downloading Maven 3.9.6 ==="
  curl -L -o maven.tar.gz "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz"
  mkdir -p maven
  tar -xzf maven.tar.gz -C maven --strip-components=1
  rm maven.tar.gz
else
  echo "=== Maven already exists, skipping download ==="
fi

export M2_HOME="$(pwd)/maven"
export PATH="$M2_HOME/bin:$PATH"

# Verify versions
java -version
mvn -version

# 3. Build the backend
echo "=== Building backend ==="
cd backend
mvn clean package -DskipTests -B
cd ..

echo "=== Build Completed Successfully ==="
