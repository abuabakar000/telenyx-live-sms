import { getCarrierAlertStatusAction } from '../src/app/actions';

async function test() {
  console.log('Testing getCarrierAlertStatusAction...');
  try {
    const res = await getCarrierAlertStatusAction();
    console.log('RESULT:', res);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
