# Repository-root build context; RunPod GitHub Dockerfile path: runpod/Dockerfile.
# Official PyTorch 2.9.1 / CUDA 12.8 runtime digest verified 2026-10-22.
FROM pytorch/pytorch:2.9.1-cuda12.8-cudnn9-runtime@sha256:7b324d212a4450795b49edba9949b7cdc72429148a64e974334bfe5774d51385
WORKDIR /worker
ENV PYTHONUNBUFFERED=1 HF_HUB_DISABLE_TELEMETRY=1 TOKENIZERS_PARALLELISM=false
COPY runpod/requirements.txt /worker/requirements.txt
RUN python -m pip install --no-cache-dir -r /worker/requirements.txt
COPY runpod/contract.json runpod/contract.py runpod/handler.py runpod/download_model.py /worker/
# Download once during the container build, not during a billed GPU request.
RUN python /worker/download_model.py
CMD ["python", "-u", "/worker/handler.py"]
