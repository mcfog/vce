import * as util from 'vce/lib/util';

describe('vce util', () => {
  it('delegate works', () => {
    setupHtml(`
<div class="foo">
  <div class="root">
    <div class="bar">
      <div class="baz">
        <button class="inner">-</button>
      </div>
    </div>
  </div>
</div>
    `);

    util.delegate(document.querySelector('.root'), '.baz', 'click',
      (event) => {
        expect(event.currentTarget instanceof MouseEvent).toBe(false);
      },
    );

    util.delegate(document.querySelector('.root'), '.foo', 'click',
      () => {
        fail('element outside root should not trigger event');
      },
    );

    document.querySelector('.inner').click();
  });
});
