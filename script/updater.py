import requests
import datetime
import json

STEVEN_URL = "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn-social/hosts"
BLOCKER_DNS_URL = "https://blockerdns.com/hosts-ads.json"
FRED_DNS_URL = "https://raw.githubusercontent.com/fredjoseph/dns-blocker/master/script/domains.json"

def diff(first, second):
    second = set(second)
    return [item for item in first if item not in second]

with requests.get(STEVEN_URL, stream=True) as r1:
    steven_list = ["*://{}/*".format(line.split(' ')[1]) for line in r1.iter_lines(decode_unicode=True) if line.startswith('0.0.0.0')]

blocker_dns_list = requests.get(BLOCKER_DNS_URL).json()['adDomains']
blocker_dns_list_filtered = diff(blocker_dns_list, steven_list)

fred_list = requests.get(FRED_DNS_URL).json()
fred_list_filtered = diff(fred_list, steven_list)

full_list = steven_list + blocker_dns_list_filtered + fred_list_filtered

data = {
    'version': datetime.datetime.now().date().isoformat(),
    'domains': full_list
}

print('Steven List: {0} elements', len(steven_list))
print('Blocker DNS List: {0} elements (unique: {1})', len(blocker_dns_list), len(blocker_dns_list_filtered))
print('Fred DNS List: {0} elements (unique: {1})', len(fred_list), len(fred_list_filtered))
print('Total Elements : {0}'.format(len(full_list)))

with open('../data.js', 'w') as outfile:
    outfile.write("const data =")
    json.dump(data, outfile, indent=4)