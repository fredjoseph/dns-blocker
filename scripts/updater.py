import sys, argparse, requests, datetime, json
import subprocess as cmd
from pathlib import Path

STEVEN_URL = "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn-social/hosts"
BLOCKER_DNS_URL = "https://blockerdns.com/hosts-ads.json"
MY_DNS_URL = "https://raw.githubusercontent.com/fredjoseph/dns-blocker/master/scripts/domains.json"

def diff(first, second):
    second = set(second)
    return [item for item in first if item not in second]

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--publish", help="push updates directly to 'origin master'", action="store_true")
    args = parser.parse_args()

    with requests.get(STEVEN_URL, stream=True) as r1:
        steven_list = ["*://{}/*".format(line.split(' ')[1]) for line in r1.iter_lines(decode_unicode=True) if line.startswith('0.0.0.0')]

    blocker_dns_list = requests.get(BLOCKER_DNS_URL).json()['adDomains']
    blocker_dns_list_filtered = diff(blocker_dns_list, steven_list)

    my_list = requests.get(MY_DNS_URL).json()['domains']
    my_list_filtered = diff(my_list, steven_list)

    full_list = steven_list + blocker_dns_list_filtered + my_list_filtered

    data = {
        'version': datetime.datetime.now().date().isoformat(),
        'domains': full_list
    }

    print('Steven List: {0} elements'.format(len(steven_list)))
    print('Blocker DNS List: {0} elements (unique: {1})'.format(len(blocker_dns_list), len(blocker_dns_list_filtered)))
    print('My DNS List: {0} elements (unique: {1})'.format(len(my_list), len(my_list_filtered)))
    print('Total Elements : {0}'.format(len(full_list)))

    data_path = Path(__file__).parent / '../web-extension/data.json'
    with open(data_path, 'r') as current_file:
        current_data = json.load(current_file)

    if len(current_data['domains']) != len(data['domains']) or len(diff(data['domains'], current_data['domains'])):
        with open(data_path, 'w') as out_file:
            json.dump(data, out_file, indent=4)
        if args.publish:
            cmd.run("git add .", check=True, shell=True)
            cmd.run("git commit -m \"Update list of blocked domains\"", check=True, shell=True)
            cmd.run("git push origin master", check=True, shell=True)
    else:
        print('No change to commit')
   
if __name__ == "__main__":
   main(sys.argv[1:])