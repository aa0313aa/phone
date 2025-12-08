// /modules/leonardo_image.js
import dotenv from 'dotenv';
dotenv.config();

// Phoenix 모델 ID (너 계정에서 실제로 존재하는 ID로 교체 가능)
const MODEL_PHOENIX = 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3';

export async function createLeonardoImage(prompt) {
  console.log('🔥 Phoenix 이미지 생성 요청...');

  const response = await fetch(
    'https://cloud.leonardo.ai/api/rest/v1/generations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: MODEL_PHOENIX,
        prompt,
        width: 1024,
        height: 1024,
        alchemy: true,
        num_inference_steps: 15,
        num_images: 1,
      }),
    }
  );

  const json = await response.json();

  if (!json.sdGenerationJob?.generationId) {
    console.log('❌ generationId 생성 실패');
    return null;
  }

  const generationId = json.sdGenerationJob.generationId;
  console.log('🔍 generationId:', generationId);

  // 결과 폴링(3초 × 최대 20번)
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const pollRes = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      { headers: { Authorization: `Bearer ${process.env.LEONARDO_API_KEY}` } }
    );

    const pollJson = await pollRes.json();

    const url = pollJson?.generations_by_pk?.generated_images?.[0]?.url;

    if (url) {
      console.log('🎉 Phoenix 이미지 생성 성공!');
      console.log('📷 URL:', url);
      return url;
    }
  }

  console.log('❌ 이미지 생성 실패');
  return null;
}
