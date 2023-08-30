//Скрипт 1. Передача результату опрацювання документа в ESIGN
function onTaskExecuteVerifyRequest(routeStage) {
  debugger;
  var signatures = [];
  var command;
  if (routeStage.executionResult == "executed") {
    command = "CompleteTask";
    signatures = EdocsApi.getSignaturesAllFiles();
  } else {
    command = "RejectTask";
  }
  var DocCommandData = {};

  DocCommandData.extSysDocID = CurrentDocument.id;
  DocCommandData.extSysDocVersion = CurrentDocument.version;
  DocCommandData.command = command;
  DocCommandData.legalEntityCode = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  DocCommandData.userEmail = EdocsApi.getEmployeeDataByEmployeeID(CurrentUser.employeeId).email;
  DocCommandData.userTitle = CurrentUser.fullName;
  DocCommandData.comment = routeStage.comment;
  DocCommandData.signatures = signatures;

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processDocCommand", // метод зовнішньої системи
    data: DocCommandData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: false, // виконувати завдання асинхронно
  };
}

//Скрипт 2. Зміна властивостей атрибутів при створені документа
function setInitialRequired() {
  if (CurrentDocument.inExtId) {
    controlRequired("edocsIncomeDocumentNumber");
    controlRequired("edocsIncomeDocumentDate");
    controlRequired("DataInspection");
    controlRequired("PlaceInspection");
    controlRequired("NumberLocomotive");
    controlRequired("DataInspection");
    controlRequired("SeriesLocomotive");
    controlRequired("NumberLocom");
    controlRequired("NumberContract");
    controlRequired("DateContract");
    controlRequired("edocsDocSum");
    controlRequired("RequestVATPerecent");
  } else {
    controlRequired("edocsIncomeDocumentNumber", false);
    controlRequired("edocsIncomeDocumentDate", false);
    controlRequired("DataInspection", false);
    controlRequired("PlaceInspection", false);
    controlRequired("NumberLocomotive", false);
    controlRequired("DataInspection", false);
    controlRequired("SeriesLocomotive", false);
    controlRequired("NumberLocom", false);
    controlRequired("NumberContract", false);
    controlRequired("DateContract", false);
    controlRequired("edocsDocSum", false);
    controlRequired("RequestVATPerecent", false);
  }
}

function controlRequired(CODE, required = true) {
  const control = EdocsApi.getControlProperties(CODE);
  control.required = required;
  EdocsApi.setControlProperties(control);
}

function onCardInitialize() {
  setInitialRequired();
  CreateAccountTask();
}

//Скрипт 3. Неможливість внесення змін в поля карточки
function CreateAccountTask() {
  const stateTask = EdocsApi.getCaseTaskDataByCode("CreateAccount").state;
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "completed'") {
    controlDisabled("edocsIncomeDocumentNumber");
    controlDisabled("edocsIncomeDocumentDate");
    controlDisabled("DataInspection");
    controlDisabled("Comment");
    controlDisabled("NumberLocomotive");
    controlDisabled("PlaceInspection");
    controlDisabled("SeriesLocomotive");
    controlDisabled("Comment");
    controlDisabled("NumberLocom");
    controlDisabled("Section");
    controlDisabled("NumberContract");
    controlDisabled("DateContract");
    controlDisabled("edocsDocSum");
    controlDisabled("RequestVATPerecent");
  } else {
    controlDisabled("edocsIncomeDocumentNumber", false);
    controlDisabled("edocsIncomeDocumentDate", false);
    controlDisabled("DataInspection", false);
    controlDisabled("Comment", false);
    controlDisabled("NumberLocomotive", false);
    controlDisabled("PlaceInspection", false);
    controlDisabled("SeriesLocomotive", false);
    controlDisabled("Comment", false);
    controlDisabled("NumberLocom", false);
    controlDisabled("Section", false);
    controlDisabled("NumberContract", false);
    controlDisabled("DateContract", false);
    controlDisabled("edocsDocSum", false);
    controlDisabled("RequestVATPerecent", false);
  }
}

function controlDisabled(CODE, disabled = true) {
  const control = EdocsApi.getControlProperties(CODE);
  control.disabled = disabled;
  EdocsApi.setControlProperties(control);
}

//4. // Вирахування суми ПДВ заявки
function calculationRequestAmount() {
  let VATpercentage = 0;
  const attrVATAmount = EdocsApi.getAttributeValue("RequestVATAmmount");
  const attrVATpercentage = EdocsApi.getAttributeValue("RequestVATPerecent");
  const attrContractAmount = EdocsApi.getAttributeValue("edocsDocSum");
  const attrAmountOutVAT = EdocsApi.getAttributeValue("RequestAmmountOutVat");

  switch (attrVATpercentage.value) {
    case "20%": // if (x === 'если сумма НДС=20%')
      VATpercentage = 1.2;
      break;

    case "7%": // if (x === 'если сумма НДС=7%')
      VATpercentage = 1.07;
      break;
  }

  if (attrVATpercentage.value === null || attrContractAmount.value === null) {
    // если нет ставки НДС и суммы, то укажем ноль в сумме НДС и без НДС
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = 0;
  } else if (VATpercentage == 0) {
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = attrContractAmount.value;
  } else {
    attrAmountOutVAT.value = Math.floor((100 * attrContractAmount.value) / VATpercentage) / 100;
    attrVATAmount.value = attrContractAmount.value - attrAmountOutVAT.value;
  }

  EdocsApi.setAttributeValue(attrVATAmount);
  EdocsApi.setAttributeValue(attrAmountOutVAT);
}

function onChangeedocsDocSum() {
  calculationRequestAmount();
}

function onChangeRequestVATPerecent() {
  calculationRequestAmount();
}

function onCreate() {
  setContractorOnCreate(EdocsApi.getInExtAttributes(CurrentDocument.id.toString()));
}

function setContractorOnCreate(portalData) {
  const code = portalData.tableAttributes.filter(x => x.code == "LegalEntityCode").map(y => y.value)[0];

  try {
    const conInfo = EdocsApi.getContractorByCode(code, "debtor");
    debugger;
    if (conInfo) {
      EdocsApi.setAttributeValue({ code: "ContractorId", value: conInfo.contractorId });
      EdocsApi.setAttributeValue({ code: "ContractorShortName", value: conInfo.shortName });
      EdocsApi.setAttributeValue({ code: "ContractorFullName", value: conInfo.fullName });
      EdocsApi.setAttributeValue({ code: "CustomerEDRPOU", value: conInfo.code });
      EdocsApi.setAttributeValue({ code: "ContractorIPN", value: conInfo.taxId });
      EdocsApi.setAttributeValue({ code: "VATStatusContractor", value: conInfo.taxPayerStatus });
      EdocsApi.setAttributeValue({ code: "LegaladdressContractor", value: conInfo.legalAddress });
      EdocsApi.setAttributeValue({ code: "PostaddressContractor", value: conInfo.legalAddressCity });
    }
  } catch (e) {
    EdocsApi.message(e);
  }
}

function setContractorOnCardSave(portalData) {
  const code = portalData.tableAttributes.filter(x => x.code == "LegalEntityCode").map(y => y.value)[0];
  try {
    const conInfo = EdocsApi.getContractorByCode(code, "debtor");
    debugger;
    if (conInfo) {
      if (conInfo.accounts) {
        if (!EdocsApi.getAttributeValue("AccountContractor").value) EdocsApi.setAttributeValue({ code: "AccountContractor", value: conInfo.accounts[0].number });
        if (!EdocsApi.getAttributeValue("BankContractor").value) EdocsApi.setAttributeValue({ code: "BankContractor", value: conInfo.accounts[0].bank });
        if (!EdocsApi.getAttributeValue("MFIContractor").value) EdocsApi.setAttributeValue({ code: "MFIContractor", value: conInfo.accounts[0].mfo });
      }
      if (conInfo.authorisedPersons) {
        if (!EdocsApi.getAttributeValue("ContractorAgent").value) EdocsApi.setAttributeValue({ code: "ContractorAgent", value: conInfo.authorisedPersons[0].fullName });
        if (!EdocsApi.getAttributeValue("ContractorAgentid").value) EdocsApi.setAttributeValue({ code: "ContractorAgentid", value: conInfo.authorisedPersons[0].id });
        if (!EdocsApi.getAttributeValue("ContractorAgentPosition").value) EdocsApi.setAttributeValue({ code: "ContractorAgentPosition", value: conInfo.authorisedPersons[0].position });
        if (!EdocsApi.getAttributeValue("ActsOnBasisContractor").value) EdocsApi.setAttributeValue({ code: "ActsOnBasisContractor", value: conInfo.authorisedPersons[0].actingUnderThe });
      }
      if (conInfo.contacts) {
        if (!EdocsApi.getAttributeValue("TelephoneContractor").value) EdocsApi.setAttributeValue({ code: "TelephoneContractor", value: conInfo.contacts.find(x => x.type == "Phone")?.contact });
        if (!EdocsApi.getAttributeValue("EmailContractor").value) EdocsApi.setAttributeValue({ code: "EmailContractor", value: conInfo.contacts.find(x => x.type == "Email")?.contact });
      }
    }
  } catch (e) {
    EdocsApi.message(e);
  }
}

function onBeforeCardSave() {
  setContractorOnCardSave(EdocsApi.getInExtAttributes(CurrentDocument.id.toString()));
}
