pipeline {
    agent any
    
    environment {
        PATH = "/root/.nvm/versions/node/v22.14.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'feature_test', url: 'https://github.com/sakura11107/vehicle_client.git'
            }
        }
        
        stage('Install') {
            steps {
                sh 'pnpm install'
            }
        }
        
        stage('Build') {
            steps {
                sh 'pnpm build'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'rm -rf /var/www/vehicle/*'
                sh 'cp -r dist/* /var/www/vehicle/'
                sh 'systemctl reload nginx'
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
