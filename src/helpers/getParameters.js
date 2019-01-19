export function getParameterByName(name, url) {
  let urlString = url;
  if (!urlString) {
    urlString = window.location.href;
  }
  const parameterName = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + parameterName + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(urlString);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
