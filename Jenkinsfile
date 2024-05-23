def CREDS = [
    aws(credentialsId: 'aws',
        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'),
    string(credentialsId: 'github-api-token',
           variable: 'GITHUB_TOKEN')
]

def GIT_BRANCH = [env.CHANGE_BRANCH, env.BRANCH_NAME]?.find{branch -> branch != null}

def NPMRC = [
    configFile(fileId: 'npmrc', variable: 'NPM_CONFIG_USERCONFIG')
]

def filesyncAlert(String branch) {
    if (branch.startsWith("filesync")) {
        slackSend(color: "danger", channel: "#filesync-ci", message: "${env.JOB_NAME} failed! <${env.BUILD_URL}|link>")
    }
}

pipeline {
    agent {
        node {
            label 'ec2-fleet'
            customWorkspace("/tmp/workspace/${BUILD_TAG.replaceAll('%2F', '_')}")
        }
    }

    options {
        ansiColor 'xterm'
        timeout time: 1, unit: 'HOURS'
        timestamps()
        withCredentials(CREDS)
    }

    environment {
        GIT_BRANCH = "${GIT_BRANCH}"
        LAST_COMMITTER = sh(script: 'git log -1 --format=%ae', returnStdout: true).trim()
    }

    tools {
        nodejs 'NodeJS 18'
    }

    stages {
        stage('Last committer not logdnabot') {
            when {
                not {
                    allOf {
                        branch 'main'
                        environment name: 'LAST_COMMITTER', value: 'bot@logdna.com'
                    }
                }
            }
            stages {
                stage('Setup') {
                    steps {
                        configFileProvider(NPMRC) {
                            sh 'npm ci --ignore-scripts'
                            sh 'npm run release-tool:install'
                        }
                    }
                }

                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                        sh 'npm run release-tool:lint'
                    }
                }

                stage('Test') {
                    steps {
                        sh 'mkdir -p coverage'
                        sh 'npm run test'
                        sh 'npm run release-tool:test'
                    }
                }

                stage('Release:Dry') {
                    when {
                        not { branch 'main' }
                    }

                    steps {
                        sh 'npm run release:dry'
                    }
                }

                stage('Release') {
                    when {
                        branch 'main'
                    }

                    steps {
                        sh 'npm run release'
                        sh 'npm run release-tool:clean'
                    }
                }

                stage('Build') {
                    steps {
                        sh 'npm run release-tool:build'
                    }
                }

                stage('Publish') {
                    when {
                        anyOf {
                            branch 'main'
                        }
                    }

                    steps {
                        sh 'npm run release-tool:publish'
                    }
                }
            }
        }
    }

    post {
        unsuccessful {
            filesyncAlert(GIT_BRANCH)
        }
    }
}
