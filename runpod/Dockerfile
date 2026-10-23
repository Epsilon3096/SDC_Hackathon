# Repository-root build context; RunPod GitHub Dockerfile path: runpod/Dockerfile.
# Official PyTorch 2.13.0 / CUDA 12.6 runtime manifest verified 2026-10-23.
FROM pytorch/pytorch:2.13.0-cuda12.6-cudnn9-runtime@sha256:6acf597eeb8e376a96580dde4952f37cc017fef732bb40bfc73f28f25e3f64b4
WORKDIR /worker
ENV PYTHONUNBUFFERED=1 HF_HUB_DISABLE_TELEMETRY=1 TOKENIZERS_PARALLELISM=false
# The official image uses externally managed Ubuntu Python. Keep its CUDA Torch
# visible, while installing worker packages only into our own virtual environment.
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv --system-site-packages /opt/shiftbridge-venv
ENV VIRTUAL_ENV=/opt/shiftbridge-venv
ENV PATH="/opt/shiftbridge-venv/bin:${PATH}"
COPY runpod/requirements.txt /worker/requirements.txt
COPY runpod/THIRD_PARTY_NOTICES.txt /worker/THIRD_PARTY_NOTICES.txt
RUN python -m pip install --no-cache-dir -r /worker/requirements.txt
RUN python -m pip check
# Prove the venv retains the pinned base Torch and every direct dependency pin.
RUN python -c "import json, sys, torch; from importlib.metadata import version; from pathlib import Path; pins = dict(line.strip().split('==') for line in Path('/worker/requirements.txt').read_text().splitlines() if line.strip() and not line.lstrip().startswith('#')); installed = {name: version(name) for name in pins}; assert sys.prefix != sys.base_prefix; assert torch.__version__ == '2.13.0+cu126', torch.__version__; assert torch.version.cuda == '12.6', torch.version.cuda; assert str(torch.__file__).startswith('/usr/local/lib/python3.12/'), torch.__file__; assert installed == pins, installed; print(json.dumps({'python': sys.executable, 'torch': torch.__version__, 'cuda': torch.version.cuda, 'torchPath': torch.__file__, 'dependencies': installed}))"
COPY runpod/contract.json runpod/contract.py runpod/handler.py runpod/download_model.py /worker/
# Download once during the container build, not during a billed GPU request.
RUN python /worker/download_model.py
CMD ["python", "-u", "/worker/handler.py"]
