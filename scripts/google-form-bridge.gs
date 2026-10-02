/**
 * BRVE chatbot -> Google Forms response bridge.
 * Store these Script Properties before deploying as a Web App:
 *   BRVE_FORM_ID, BRVE_FORM_BRIDGE_SECRET,
 *   BRVE_NAME_ITEM_ID, BRVE_EMAIL_ITEM_ID, BRVE_PHONE_ITEM_ID, BRVE_BRIEF_ITEM_ID
 * The four item IDs are the Google Form question IDs (the numeric part of entry.<ID>).
 * Run createBrveForm() once to create a form and save all form/item IDs automatically.
 */
function doPost(event) {
  try {
    var payload = JSON.parse(event.postData.contents || "{}");
    var properties = PropertiesService.getScriptProperties();
    var expectedSecret = properties.getProperty("BRVE_FORM_BRIDGE_SECRET");
    if (!expectedSecret || payload.secret !== expectedSecret) return output({ ok: false });

    var formId = properties.getProperty("BRVE_FORM_ID");
    var form = FormApp.openById(formId);
    var items = [
      ["BRVE_NAME_ITEM_ID", payload.name],
      ["BRVE_EMAIL_ITEM_ID", payload.email],
      ["BRVE_PHONE_ITEM_ID", payload.phone],
      ["BRVE_BRIEF_ITEM_ID", payload.brief],
    ];
    var response = form.createResponse();
    items.forEach(function (field) {
      var itemId = properties.getProperty(field[0]);
      if (!itemId || field[1] === undefined) throw new Error("A form field is not configured.");
      var item = form.getItemById(Number(itemId));
      if (!item || item.getType() !== FormApp.ItemType.TEXT) throw new Error("A configured form question must be short answer text.");
      response.withItemResponse(item.asTextItem().createResponse(String(field[1])));
    });
    response.submit();
    return output({ ok: true });
  } catch (error) {
    console.error("BRVE form submission failed", error);
    return output({ ok: false });
  }
}

function createBrveForm() {
  var properties = PropertiesService.getScriptProperties();
  var existingId = properties.getProperty("BRVE_FORM_ID");
  var form = existingId ? FormApp.openById(existingId) : FormApp.create("BRVE.AI — Project brief");
  form.setDescription("Tell us who you are and what you are working on. The BRVE team will follow up.");
  form.setCollectEmail(false);

  var name = findOrCreateTextItem(form, "Name");
  var email = findOrCreateTextItem(form, "Email");
  email.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  var phone = findOrCreateTextItem(form, "Phone number");
  var brief = findOrCreateTextItem(form, "What are you working on?");
  brief.setHelpText("A few sentences about the challenge, timing, or what you need.");
  brief.setRequired(true);

  properties.setProperties({
    BRVE_FORM_ID: form.getId(),
    BRVE_NAME_ITEM_ID: String(name.getId()),
    BRVE_EMAIL_ITEM_ID: String(email.getId()),
    BRVE_PHONE_ITEM_ID: String(phone.getId()),
    BRVE_BRIEF_ITEM_ID: String(brief.getId()),
  });
  Logger.log("Responder URL: " + form.getPublishedUrl());
  Logger.log("Form ID and question IDs saved to Script Properties.");
}

function findOrCreateTextItem(form, title) {
  var existing = form.getItems(FormApp.ItemType.TEXT).find(function (item) { return item.getTitle() === title; });
  var item = existing ? existing.asTextItem() : form.addTextItem().setTitle(title);
  item.setRequired(true);
  return item;
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
