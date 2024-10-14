#!/bin/bash

url="http://localhost:3000/api/groups/[]/like"

for batch in {1..100} # 100개의 배치를 생성 (총 10,000번 요청을 위해)
do
  echo "Sending batch $batch..."

  for i in {1..100} # 각 배치마다 100개의 요청을 보냄
  do
    curl -X POST "$url" &
  done

  # 모든 백그라운드 작업들이 완료될 때까지 기다림
  wait
  echo "Batch $batch completed."
done