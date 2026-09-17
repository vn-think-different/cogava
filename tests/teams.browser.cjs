// Optional browser integration check: run Vite on 127.0.0.1:4173 first.
// All remote requests are blocked; this test never contacts production Firebase.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless:true });
 try {
 for(const role of ['ADMIN','DOI_TRUONG','NHAN_VIEN']) {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
  await context.addInitScript(({role})=>{
   const users=[{id:'admin-test',username:'admin-test',password:'test',tenHienThi:'Admin kiểm thử',vaiTro:'ADMIN'}, {id:'captain-test',username:'captain-test',password:'test',tenHienThi:'Đội trưởng kiểm thử',vaiTro:'DOI_TRUONG',nhanVienId:'e1',doiId:'a'},{id:'worker-test',username:'worker-test',password:'test',tenHienThi:'Nhân viên kiểm thử',vaiTro:'NHAN_VIEN',nhanVienId:'e2',doiId:'b'}];
   const teams=[{id:'a',tenDoi:'Đội kiểm thử A',doiTruongUserId:'captain-test',donGiaMacDinh:1500},{id:'b',tenDoi:'Đội kiểm thử B',donGiaMacDinh:1700}];
   const employees=[{id:'e1',hoTen:'Đội trưởng kiểm thử',vaiTro:'CHINH',doiId:'a',trangThai:'DANG_LAM',ngayVaoLam:'2026-01-01'}, {id:'e2',hoTen:'Nhân viên kiểm thử',vaiTro:'PHU',doiId:'b',trangThai:'DANG_LAM',ngayVaoLam:'2026-01-01'}];
   const records=[{id:'old',ngay:'2026-09-01',doiId:'a',soGaBatDuoc:10,donGiaApDung:1200,tongLuongNgay:12000,trangThai:'NHAP',thuTrongTuan:'Thứ Ba',chiTiet:[{id:'d1',banGhiNgayId:'old',nhanVienId:'e1',hoTen:employees[0].hoTen,vaiTro:'CHINH',coMat:true,luongNhanDuoc:6900},{id:'d2',banGhiNgayId:'old',nhanVienId:'e2',hoTen:employees[1].hoTen,vaiTro:'PHU',coMat:true,luongNhanDuoc:5100}]}];
   for(const [key,value] of Object.entries({users,teams,employees,attendance_records:records}))localStorage.setItem('cogava_payroll_db_v3_'+key,JSON.stringify(value));
   sessionStorage.setItem('cogava_payroll_auth_session_active','true');sessionStorage.setItem('cogava_payroll_auth_session_user',JSON.stringify(users.find(u=>u.vaiTro===role)));
  },{role});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/');await page.locator('#main-content').waitFor();
  if(role==='NHAN_VIEN') {
   await page.getByText('1.200 đ/con',{exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Nhân viên',exact:true}).count(),0);
   assert.equal(await page.getByRole('button',{name:'Chấm công ngày',exact:true}).count(),0);
  } else {
   await page.getByRole('button',{name:'Bảng lương tháng',exact:true}).first().click();
   await page.locator('#main-content').getByText('Nhân viên kiểm thử',{exact:true}).first().waitFor();
   await page.getByRole('button',{name:'Chấm công ngày',exact:true}).first().click();
   await page.locator('#input-selected-date').fill('2026-09-01');
   await page.locator('#main-content').getByText('Nhân viên kiểm thử',{exact:true}).first().waitFor();
   assert.equal(await page.locator('#input-custom-price').inputValue(),'1200');
   if(role==='DOI_TRUONG') {
    assert.equal(await page.locator('#input-custom-price').isDisabled(),true);
    assert.equal(await page.getByRole('button',{name:'Nhân viên',exact:true}).count(),0);
    await page.locator('#input-selected-date').fill('2026-09-02');
    assert.equal(await page.getByText('Tùy chỉnh giá',{exact:true}).count(),0);
   } else {
    await page.locator('#input-selected-date').fill('2026-09-03');
    await page.getByText('Tùy chỉnh giá',{exact:true}).click();
    await page.locator('#input-custom-price').fill('1800');
    await page.getByRole('button',{name:'Lưu đơn giá ngày cho đội (chưa lưu chấm công)',exact:true}).click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cogava_payroll_db_v3_teams')).find(t=>t.id==='a').donGiaTheoNgay['2026-09-03']),1800);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cogava_payroll_db_v3_attendance_records'))[0].donGiaApDung),1200);
    await page.getByRole('button',{name:'Nhân viên',exact:true}).first().click();
    await page.getByRole('button',{name:/Quản lý.*đội/i}).first().click();
    await page.getByLabel('Đơn giá mặc định',{exact:true}).waitFor();
    assert.equal(await page.getByLabel('Đơn giá mặc định',{exact:true}).inputValue(),'1200');
    const historyBefore=await page.evaluate(()=>localStorage.getItem('cogava_payroll_db_v3_attendance_records'));
    await page.getByPlaceholder('VD: Đội 1 - Dĩ An').fill('Đội mới kiểm thử');
    await page.getByLabel('Đơn giá mặc định',{exact:true}).fill('1900');
    await page.getByLabel('Đội trưởng phụ trách',{exact:true}).selectOption('captain-test');
    await page.getByRole('button',{name:'Tạo đội mới',exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cogava_payroll_db_v3_teams')).some(t=>t.tenDoi==='Đội mới kiểm thử'));
    const state=await page.evaluate(()=>Object.fromEntries(['teams','users','employees'].map(k=>[k,JSON.parse(localStorage.getItem('cogava_payroll_db_v3_'+k))])));
    const created=state.teams.find(t=>t.tenDoi==='Đội mới kiểm thử');
    assert.equal(created.donGiaMacDinh,1900);
    assert.equal(created.doiTruongUserId,'captain-test');
    assert.equal(state.teams.find(t=>t.id==='a').doiTruongUserId,'');
    assert.equal(state.employees.find(e=>e.id==='e1').doiId,created.id);
    assert.equal(state.users.find(u=>u.id==='captain-test').doiId,created.id);
    assert.equal(await page.evaluate(()=>localStorage.getItem('cogava_payroll_db_v3_attendance_records')),historyBefore);
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS browser role '+role);await context.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
