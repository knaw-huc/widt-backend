# WIDT-backend in Kubernetes

## step 1: convert docker-compose.yml to k8s files

Used the tool `kompose` (https://kompose.io)

`$ kompose --file docker-compose.yml convert`

Then manual cleanup, correction and extension of the resulting files

## step 2: deployment in k8s cluster

### preparatory steps

 * Create namespace `wieisdetrol` in k8s cluster
 * Create on local machine directories with persistent data from dockerhost, to be copied to k8s:
    * `widt-backend`: contents of widt-backend git repo
    * `docker-entrypoint-initdb.d`: dump of widt mariadb database
    * `videos`: video files to be served by nginx
    * `wieisdetrol-bot`: data for `bot` deployment
    * `bot-site-packages`: content of `/opt/conda/lib/python3.10/site-packages` to prevent huge download on each Pod restart

### persistent volumeclaims (PVCs) in k8s 

create PVCs

```shell
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-videos.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-backendapp.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-backup.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-bot.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-db.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-docker-entrypoint-db.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f pvc-bot-site-packages.yaml
```

create temporary Pod for copying data to PVCs

`kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f temp-pod.yml`

go to one level above the directories with data to be copied and copy the data with the followoing commands

```shell
kubectl --kubeconfig=<kubeconfig file> cp ./docker-entrypoint-initdb.d/. wieisdetrol/temp:/docker-entrypoint-db/
kubectl --kubeconfig=<kubeconfig file> cp ./widt-backend/. wieisdetrol/temp:/backendapp/
kubectl --kubeconfig=<kubeconfig file> cp ./wieisdetrol-bot/. wieisdetrol/temp:/bot/
kubectl --kubeconfig=<kubeconfig file> cp ./videos/. wieisdetrol/temp:/videos/
kubectl --kubeconfig=<kubeconfig file> cp ./bot-site-packages/. wieisdetrol/temp:/site-packages/
```

delete the temporary Pod

`kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol delete -f temp-pod.yml`

### deploy secret, deployments, cronjob, services, ingress

```shell
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f widt-secrets.yml

kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f db-deployment.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f db-service.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f db-backup-script.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f db-backup-cronjob.yaml

kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f widt-redis-deployment.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f widt-redis-service.yaml

kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f backendapp-deployment.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f backendapp-service.yaml

kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f nginx-config.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f nginx-service.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f nginx-deployment.yaml

kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f bot-deployment.yaml
kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f bot-service.yaml

kubectl --kubeconfig=<kubeconfig file> -n wieisdetrol apply -f widt-ingress.yaml
```

Deployment should now be up and running

* database is backed up to the `pvc-backup` PVC according to the schedule defined in `widt-db-backup-cronjob`
* updates to widt-backend must be done manually by opening a shell in the `backendapp-git` container, which is part of the `backendapp` deployment, and doing a `git pull` in `/backendapp`.