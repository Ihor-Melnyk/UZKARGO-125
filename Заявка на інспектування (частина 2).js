//Скрипт 1. Автоматичне заповнення атрибутів по контрагенту із довідника при отриманні документу із зовнішньої системи

function onCardRendered() {
  debugger;
  const portalData = EdocsApi.getInExtAttributes(CurrentDocument.id.toString());
  setContractor(portalData);
}

function setContractor(portalData) {
  if (!EdocsApi.getAttributeValue("ContractorId").value) {
    const code = portalData.tableAttributes.filter(x => x.code == "LegalEntityCode").map(y => y.value)[0];

    try {
      const conInfo = EdocsApi.getContractorByCode(code, "debtor");
      debugger;
      if (conInfo) {
        EdocsApi.setAttributeValue({ code: "ContractorId", value: conInfo.contractorId });
        EdocsApi.setAttributeValue({ code: "ContractorShortName", value: conInfo.shortName });
        EdocsApi.setAttributeValue({ code: "ContractorFullName", value: conInfo.fullName });
        EdocsApi.setAttributeValue({ code: "ContractorEDRPOU", value: conInfo.code });
        EdocsApi.setAttributeValue({ code: "ContractorIPN", value: conInfo.taxId });
        EdocsApi.setAttributeValue({ code: "VATStatusContractor", value: conInfo.taxPayerStatus });
        EdocsApi.setAttributeValue({ code: "LegaladdressContractor", value: conInfo.legalAddress });
        EdocsApi.setAttributeValue({ code: "PostaddressContractor", value: conInfo.legalAddressCity });
        if (conInfo.accounts[0]) {
          EdocsApi.setAttributeValue({ code: "AccountContractor", value: conInfo.accounts[0].number });
          EdocsApi.setAttributeValue({ code: "BankContractor", value: conInfo.accounts[0].bank });
          EdocsApi.setAttributeValue({ code: "MFIContractor", value: conInfo.accounts[0].mfo });
        }
        if (conInfo.authorisedPersons[0]) {
          EdocsApi.setAttributeValue({ code: "ContractorAgent", value: conInfo.authorisedPersons[0].fullName });
          EdocsApi.setAttributeValue({ code: "ContractorAgentid", value: conInfo.authorisedPersons[0].id });
          EdocsApi.setAttributeValue({ code: "ContractorAgentPosition", value: conInfo.authorisedPersons[0].position });
          EdocsApi.setAttributeValue({ code: "ActsOnBasisContractor", value: conInfo.authorisedPersons[0].actingUnderThe });
        }
        if (conInfo.contacts[0]) {
          EdocsApi.setAttributeValue({ code: "TelephoneContractor", value: conInfo.contacts.find(x => x.type == "Phone")?.contact });
          EdocsApi.setAttributeValue({ code: "EmailContractor", value: conInfo.contacts.find(x => x.type == "Email")?.contact });
        }
      } else {
      }
    } catch (e) {
      EdocsApi.message(e);
    }
  }
}

function VerifyRequestTask() {
  const stateTask = EdocsApi.getCaseTaskDataByCode("VerifyRequest").state;
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "completed'") {
    controlRequired("Contractor");
    controlRequired("ContractorId");
    controlRequired("ContractorFullName");
    controlRequired("ContractorShortName");
    controlRequired("ContractorEDRPOU");
    controlRequired("ContractorIPN");
    controlRequired("VATStatusContractor");
    controlRequired("LegaladdressContractor");
    controlRequired("PostaddressContractor");
    controlRequired("BankContractor");
    controlRequired("MFIContractor");
    controlRequired("AccountContractor");
    controlRequired("TelephoneContractor");
    controlRequired("EmailContractor");
    controlRequired("ContractorAgent");
    controlRequired("ContractorAgentPosition");
    controlRequired("ActsOnBasisContractor");
    controlRequired("ContractorAgentid");
  } else {
    controlRequired("Contractor", false);
    controlRequired("ContractorId", false);
    controlRequired("ContractorFullName", false);
    controlRequired("ContractorShortName", false);
    controlRequired("ContractorEDRPOU", false);
    controlRequired("ContractorIPN", false);
    controlRequired("VATStatusContractor", false);
    controlRequired("LegaladdressContractor", false);
    controlRequired("PostaddressContractor", false);
    controlRequired("BankContractor", false);
    controlRequired("MFIContractor", false);
    controlRequired("AccountContractor", false);
    controlRequired("TelephoneContractor", false);
    controlRequired("EmailContractor", false);
    controlRequired("ContractorAgent", false);
    controlRequired("ContractorAgentPosition", false);
    controlRequired("ActsOnBasisContractor", false);
    controlRequired("ContractorAgentid", false);
  }
}

function controlRequired(CODE, required = true) {
  const control = EdocsApi.getControlProperties(CODE);
  control.required = required;
  EdocsApi.setControlProperties(control);
}
