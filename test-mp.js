// test-mp.js
const axios = require('axios');
const { randomUUID } = require('crypto');

const accessToken = 'TEST-1211846775574495-112115-dfe0fb5f87e06f1649d52505a6c67d83-182254659';

async function testPayment() {
  try {
    const response = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: 100,
        token: 'e50ee338ef75abd39c100c77dfdc5616',
        description: 'Teste',
        installments: 1,
        payment_method_id: 'visa',
        issuer_id: '25',
        payer: {
          email: 'teste@teste.com',
          identification: {
            type: 'CPF',
            number: '12345678909'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': randomUUID() // ← ADICIONAR ESTE HEADER
        }
      }
    );
    console.log('✅ Sucesso:', response.data);
    console.log('ID do pagamento:', response.data.id);
    console.log('Status:', response.data.status);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testPayment();