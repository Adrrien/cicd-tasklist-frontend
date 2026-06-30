pipeline {
    agent any

    environment {
        // Docker Hub configuration
        DOCKER_REGISTRY = "docker.io"
        DOCKER_IMAGE_NAME = "${DOCKER_REGISTRY}/adrrien/tasklist-frontend"
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_IMAGE = "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
        DOCKER_IMAGE_LATEST = "${DOCKER_IMAGE_NAME}:latest"
        
        // SonarQube configuration
        SONAR_HOST_URL = "http://sonarqube:9000"
        SONAR_LOGIN = credentials('adrrien-sonar-token')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 1, unit: 'HOURS')
    }

    stages {
        stage('Checkout') {
            steps {
                echo '=== Checkout ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Installing Dependencies ==='
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                echo '=== Building Project ==='
                sh 'npm run build'
            }
        }

        stage('Unit Tests') {
            steps {
                echo '=== Running Unit Tests ==='
                sh 'npm run test:coverage'
            }
            post {
                always {
                    echo '=== Publishing Test Reports ==='
                    junit testResults: 'coverage/junit.xml', allowEmptyResults: true
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report',
                        keepAll: true
                    ])
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo '=== Running SonarQube Analysis ==='
                sh '''
                    sonar-scanner \
                        -Dsonar.projectBaseDir=. \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_LOGIN}
                '''
            }
        }

        stage('Quality Gate') {
            steps {
                echo '=== Checking SonarQube Quality Gate ==='
                sh '''
                    sleep 5
                    sonar-scanner \
                        -Dsonar.projectBaseDir=. \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_LOGIN} \
                        -Dsonar.scanner.force-deprecated-jre=true
                '''
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '=== Building Docker Image ==='
                sh '''
                    docker build -t ${DOCKER_IMAGE} .
                    docker tag ${DOCKER_IMAGE} ${DOCKER_IMAGE_LATEST}
                '''
            }
        }

        stage('Trivy Security Scan') {
            steps {
                echo '=== Running Trivy Security Scan ==='
                sh '''
                    mkdir -p reports/security
                    trivy image \
                        --format json \
                        --output reports/security/trivy-report.json \
                        ${DOCKER_IMAGE} || true
                    
                    trivy image \
                        --format table \
                        --output reports/security/trivy-report.txt \
                        --severity HIGH,CRITICAL \
                        ${DOCKER_IMAGE} || true
                    
                    # Check for CRITICAL or HIGH vulnerabilities and fail if found
                    CRITICAL_COUNT=$(trivy image --format json ${DOCKER_IMAGE} | grep -o '"Severity":"CRITICAL"' | wc -l)
                    HIGH_COUNT=$(trivy image --format json ${DOCKER_IMAGE} | grep -o '"Severity":"HIGH"' | wc -l)
                    
                    if [ ${CRITICAL_COUNT} -gt 0 ] || [ ${HIGH_COUNT} -gt 0 ]; then
                        echo "Critical or High vulnerabilities found!"
                        echo "CRITICAL: ${CRITICAL_COUNT}, HIGH: ${HIGH_COUNT}"
                        exit 1
                    fi
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/security/**', allowEmptyArchive: true
                }
            }
        }

        stage('Generate SBOM') {
            steps {
                echo '=== Generating SBOM ==='
                sh '''
                    mkdir -p reports/sbom
                    trivy image \
                        --format cyclonedx \
                        --output reports/sbom/sbom-docker.json \
                        ${DOCKER_IMAGE}
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/sbom/**', allowEmptyArchive: true
                }
            }
        }

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                echo '=== Pushing Docker Image to Docker Hub ==='
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'adrrien-dockerhub-password',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                            echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                            docker push ${DOCKER_IMAGE}
                            docker push ${DOCKER_IMAGE_LATEST}
                            docker logout
                        '''
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo '=== Cleaning up Docker Images ==='
                sh '''
                    docker rmi -f ${DOCKER_IMAGE} || true
                    docker rmi -f ${DOCKER_IMAGE_LATEST} || true
                '''
            }
        }
    }

    post {
        always {
            echo '=== Cleaning Workspace ==='
            cleanWs()
        }
        success {
            echo '✓ Pipeline completed successfully!'
        }
        failure {
            echo '✗ Pipeline failed!'
        }
    }
}
