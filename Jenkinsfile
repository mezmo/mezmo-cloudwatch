library 'magic-butler-catalogue'

def PROJECT_NAME = "mezmo-cloudwatch"
def REPO = "mezmo/${PROJECT_NAME}"
def TRIGGER_PATTERN = ".*@logdnabot.*"
def CURRENT_BRANCH = [env.CHANGE_BRANCH, env.BRANCH_NAME]?.find{branch -> branch != null}
def DEFAULT_BRANCH = 'main'

pipeline {
  agent {
    node {
      label 'ec2-fleet'
      customWorkspace("/tmp/workspace/${env.BUILD_TAG}")
    }
  }

  options {
    timestamps()
    ansiColor 'xterm'
  }

  environment {
    GITHUB_TOKEN = credentials('github-api-token')
  }

  triggers {
    issueCommentTrigger(TRIGGER_PATTERN)
  }

  stages {
    stage('Validate PR Source') {
      when {
        expression { env.CHANGE_FORK }
        not {
          triggeredBy 'issueCommentCause'
        }
      }
      steps {
        error("A maintainer needs to approve this PR for CI by commenting")
      }
    }

    stage('Test Suite') {
      matrix {
        axes {
          axis {
            name 'NODE_VERSION'
            values '20', '22'
          }
        }

        agent {
          docker {
            image "us.gcr.io/logdna-k8s/node:${NODE_VERSION}-ci"
            label 'ec2-fleet'
            customWorkspace("/tmp/workspace/${env.BUILD_TAG}-${NODE_VERSION}")
          }
        }

        stages {
          stage('Test') {
            steps {
              sh 'npm ci'
              sh 'npm test'
            }
            post {
              always {
                junit checksName: 'Test Results', testResults: 'coverage/*.xml'
                publishHTML target: [
                  allowMissing: false,
                  alwaysLinkToLastBuild: false,
                  keepAll: true,
                  reportDir: 'coverage/lcov-report',
                  reportFiles: 'index.html',
                  reportName: "coverage-node-v${NODE_VERSION}"
                ]
              }
            }
          }
        }
      }
    }

    stage('Test Release') {
      when {
        beforeAgent true
        not {
          branch DEFAULT_BRANCH
        }
      }

      agent {
        docker {
          image "us.gcr.io/logdna-k8s/node:18-ci"
          customWorkspace("/tmp/workspace/${env.BUILD_TAG}")
          label 'ec2-fleet'
        }
      }

      environment {
        GIT_BRANCH = "${CURRENT_BRANCH}"
        BRANCH_NAME = "${CURRENT_BRANCH}"
        CHANGE_ID = ""
      }

      steps {
        sh 'npm run package'
        sh 'npm ci' // WARNING: This is necessary because the package script removed dependendices
        sh "npm run release:dry"
        sh "test -f dist/mezmo-cloudwatch.zip"
      }
    }

    stage('Release') {
      when {
        beforeAgent true
        branch DEFAULT_BRANCH
      }

      agent {
        docker {
          image "us.gcr.io/logdna-k8s/node:18-ci"
          customWorkspace("/tmp/workspace/${env.BUILD_TAG}")
          label 'ec2-fleet'
        }
      }

      steps {
        sh 'npm run package'
        sh 'npm ci' // WARNING: This is necessary because the package script removed dependendices
        sh 'npm release'
      }
    }
  }
}
