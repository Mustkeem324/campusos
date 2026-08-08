'use client';

export type WebRtcSessionState = 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'CLOSED' | 'FAILED';

export type WebRtcTransportHandle = {
  peerConnection: RTCPeerConnection;
  close: () => Promise<void>;
};

type CommonOptions = {
  endpointUrl: string;
  bearerToken: string;
  onState?: (state: WebRtcSessionState, detail?: string) => void;
};

function absoluteResourceUrl(endpointUrl: string, location: string | null) {
  if (!location) return null;
  try {
    return new URL(location, endpointUrl).toString();
  } catch {
    return null;
  }
}

async function waitForIceGatheringComplete(pc: RTCPeerConnection, timeoutMs = 5000) {
  if (pc.iceGatheringState === 'complete') return;
  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', onState);
      resolve();
    };
    const onState = () => {
      if (pc.iceGatheringState === 'complete') done();
    };
    const timer = window.setTimeout(done, timeoutMs);
    pc.addEventListener('icegatheringstatechange', onState);
  });
}

function wireState(pc: RTCPeerConnection, onState?: CommonOptions['onState']) {
  const emit = () => {
    const state = pc.connectionState;
    if (state === 'connected') onState?.('CONNECTED');
    else if (state === 'failed') onState?.('FAILED', 'WebRTC peer connection failed.');
    else if (state === 'disconnected') onState?.('DEGRADED', 'WebRTC peer connection is disconnected and may recover.');
    else if (state === 'closed') onState?.('CLOSED');
    else onState?.('CONNECTING');
  };
  pc.addEventListener('connectionstatechange', emit);
  emit();
  return () => pc.removeEventListener('connectionstatechange', emit);
}

async function postOffer(endpointUrl: string, bearerToken: string, sdp: string) {
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/sdp',
      Accept: 'application/sdp',
    },
    body: sdp,
  });
  const answer = await response.text();
  if (!response.ok || !answer.trim()) {
    throw new Error(`WebRTC media server rejected session setup (${response.status}).`);
  }
  return {
    answer,
    resourceUrl: absoluteResourceUrl(endpointUrl, response.headers.get('Location')),
  };
}

async function deleteResource(resourceUrl: string | null, bearerToken: string) {
  if (!resourceUrl) return;
  try {
    await fetch(resourceUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearerToken}` },
      keepalive: true,
    });
  } catch {
    // PeerConnection.close() still tears down the browser side if DELETE cannot be delivered.
  }
}

export async function publishWhipStream(options: CommonOptions & { stream: MediaStream }): Promise<WebRtcTransportHandle> {
  const pc = new RTCPeerConnection();
  const detachState = wireState(pc, options.onState);
  options.onState?.('CONNECTING');
  let resourceUrl: string | null = null;
  try {
    for (const track of options.stream.getTracks()) {
      pc.addTransceiver(track, { direction: 'sendonly', streams: [options.stream] });
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGatheringComplete(pc);
    const localSdp = pc.localDescription?.sdp;
    if (!localSdp) throw new Error('Browser did not produce a WebRTC SDP offer.');
    const result = await postOffer(options.endpointUrl, options.bearerToken, localSdp);
    resourceUrl = result.resourceUrl;
    await pc.setRemoteDescription({ type: 'answer', sdp: result.answer });
    return {
      peerConnection: pc,
      close: async () => {
        detachState();
        await deleteResource(resourceUrl, options.bearerToken);
        pc.close();
        options.onState?.('CLOSED');
      },
    };
  } catch (error) {
    detachState();
    pc.close();
    options.onState?.('FAILED', error instanceof Error ? error.message : 'Unable to establish WHIP publishing session.');
    throw error;
  }
}

export async function subscribeWhepStream(options: CommonOptions & {
  videoElement: HTMLVideoElement;
  includeAudio?: boolean;
}): Promise<WebRtcTransportHandle> {
  const pc = new RTCPeerConnection();
  const detachState = wireState(pc, options.onState);
  options.onState?.('CONNECTING');
  let resourceUrl: string | null = null;
  const received = new MediaStream();
  try {
    pc.addTransceiver('video', { direction: 'recvonly' });
    if (options.includeAudio) pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.addEventListener('track', (event) => {
      if (!received.getTracks().some((track) => track.id === event.track.id)) received.addTrack(event.track);
      options.videoElement.srcObject = received;
      void options.videoElement.play().catch(() => undefined);
    });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGatheringComplete(pc);
    const localSdp = pc.localDescription?.sdp;
    if (!localSdp) throw new Error('Browser did not produce a WebRTC SDP offer.');
    const result = await postOffer(options.endpointUrl, options.bearerToken, localSdp);
    resourceUrl = result.resourceUrl;
    await pc.setRemoteDescription({ type: 'answer', sdp: result.answer });
    return {
      peerConnection: pc,
      close: async () => {
        detachState();
        received.getTracks().forEach((track) => track.stop());
        await deleteResource(resourceUrl, options.bearerToken);
        pc.close();
        options.videoElement.srcObject = null;
        options.onState?.('CLOSED');
      },
    };
  } catch (error) {
    detachState();
    received.getTracks().forEach((track) => track.stop());
    pc.close();
    options.onState?.('FAILED', error instanceof Error ? error.message : 'Unable to establish WHEP viewing session.');
    throw error;
  }
}
